import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WaStatus } from 'src/common';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import * as fs from 'fs';
import * as path from 'path';
import * as qrcode from 'qrcode';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsappService.name);
    private client: Client;
    private isReady = false;
    private isLoggingOut = false;
    private latestQrDataUrl: string | null = null;
    private connectionStatus: WaStatus = 'disconnected';

    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async onModuleInit() {
        this.initClient();
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.destroy();
        }
    }

    private initClient() {
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: 'rental-bot' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
        });
        this.client = client;
        client.on('qr', async (qr) => {
            if (this.client !== client)
                return;
            this.logger.log('WhatsApp QR Code ready — broadcasting to frontend.');
            try {
                qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
                    if (!err) console.log(url);
                });
                const dataUrl = await qrcode.toDataURL(qr);
                if (this.client !== client)
                    return;
                this.latestQrDataUrl = dataUrl;
                this.connectionStatus = 'qr_pending';
            }
            catch (err) {
                this.logger.error('Failed to generate QR data URL', err);
            }
        });
        client.on('authenticated', () => {
            if (this.client !== client)
                return;
            this.logger.log('🔐 WhatsApp session authenticated.');
            this.latestQrDataUrl = null;
        });
        client.on('loading_screen', (percent, message) => {
            if (this.client !== client)
                return;
            this.logger.log(`⏳ WhatsApp loading: ${percent}% — ${message}`);
        });
        client.on('ready', () => {
            if (this.client !== client)
                return;
            this.isReady = true;
            this.connectionStatus = 'connected';
            this.latestQrDataUrl = null;
            this.logger.log('✅ WhatsApp Bot is ready and connected!');
        });
        client.on('auth_failure', (msg) => {
            if (this.client !== client)
                return;
            this.isReady = false;
            this.connectionStatus = 'disconnected';
            this.latestQrDataUrl = null;
            this.logger.error(`WhatsApp auth failed: ${msg}`);
        });
        client.on('disconnected', (reason) => {
            if (this.client !== client)
                return;
            this.isReady = false;
            this.connectionStatus = 'disconnected';
            this.latestQrDataUrl = null;
            this.logger.warn(`WhatsApp disconnected: ${reason}`);
            if (!this.isLoggingOut) {
                this.logger.warn('Reconnecting...');
                setTimeout(() => this.initClient(), 5000);
            }
        });
        client.on('message', async (msg: Message) => {
            if (this.client !== client)
                return;
            await this.handleIncomingMessage(msg);
        });

        client.on('call', async (call) => {
            if (this.client !== client || !call.from)
                return;
            try {
                this.logger.log(`Menolak panggilan masuk secara otomatis dari ID: ${call.from}`);
                await call.reject();
                await this.sendMessage(call.from, '🤖 *Auto-Reply:*\nMohon maaf, bot ini adalah layanan otomatis dan tidak dapat menerima panggilan suara maupun video. Silakan sampaikan melalui pesan teks (jangan lupa di-mention / tag jika di grup).');
            } catch (err) {
                this.logger.error('Gagal menolak panggilan (auto-reject)', err);
            }
        });

        client.initialize();
    }

    private sleep(min: number, max: number): Promise<void> {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async handleIncomingMessage(msg: Message) {
        try {
            // Abaikan jika bukan dari grup (mengabaikan pesan pribadi)
            if (!msg.from?.endsWith('@g.us') || msg.from === 'status@broadcast')
                return;

            // Uncomment baris di bawah jika ingin mencari tahu ID dari grup target:
            // this.logger.log(`Incoming Message from GROUP ID: ${msg.from}`);

            const ALLOWED_GROUPS: string[] = [
                // '123456789@g.us'
                '120363423475556743@g.us'
            ];

            if (ALLOWED_GROUPS.length > 0 && !ALLOWED_GROUPS.includes(msg.from)) {
                return;
            }

            // Cek apakah bot di-mention di pesan ini
            const mentions = await msg.getMentions();
            const botId = this.client.info.wid._serialized;
            const isMentioned = mentions.some(contact => contact.id._serialized === botId);

            if (!isMentioned) {
                return;
            }

            try {
                const chat = await msg.getChat();
                await chat.sendSeen();
                await chat.sendStateTyping();
                await this.sleep(1500, 3000);
                await chat.clearState();
            }
            catch (err) {
                this.logger.warn('Gagal set status read/typing', err);
            }

            const body = msg.body || '';
            // Memeriksa apakah kata "kas" atau "bayar kas" dipanggil sebagai perintah utama (mengabaikan mention diawal)
            const isKasCommand = /^(?:@\d+\s+)?(?:bayar\s+)?kas\b/i.test(body.trim());
            
            if (isKasCommand) {
                // Parse pattern: @BotName kas [Nama] [Jumlah] [Bulan/Keterangan]
                const kasRegex = /^(?:@\d+\s+)?(?:bayar\s+)?kas\s+(\w+)\s+(\d+)(?:\s+(.+))?/i;
                const match = body.trim().match(kasRegex);

                if (match) {
                    const [, memberName, amountStr, notes] = match;
                    const amount = parseInt(amountStr, 10);

                    try {
                        await this.db.insert(schema.kasRt).values({
                            name: memberName,
                            amount,
                            notes: notes || null,
                            source: 'bot',
                        });
                        
                        const rpAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
                        await msg.reply(`✅ *Iuran Kas RT Berhasil Disimpan*\n\nNama: ${memberName}\nJumlah: ${rpAmount}\nKeterangan: ${notes || '-'}`);
                    } catch (error) {
                        this.logger.error('Failed to save kas RT', error);
                        await msg.reply('❌ Maaf, terjadi kesalahan saat menyimpan iuran kas RT.');
                    }
                } else {
                    await msg.reply('ℹ️ Format perintah salah.\nGunakan: *@BotName kas [Nama] [Jumlah] [Keterangan]*\n\nContoh:\n*@BotName kas Budi 50000 Januari*');
                }
            } else {
                await msg.reply('Halo! Ada yang bisa saya bantu?');
            }
        }
        catch (err) {
            this.logger.error('Error handling incoming message', err);
        }
    }

    async sendMessage(to: string, text: string): Promise<void> {
        if (!this.isReady) {
            this.logger.warn(`WhatsApp not ready. Cannot send message to ${to}`);
            return;
        }
        try {
            let chat: Awaited<ReturnType<typeof this.client.getChatById>>;
            if (to.includes('@')) {
                chat = await this.client.getChatById(to);
            }
            else {
                const normalized = to
                    .replace(/^\+/, '')
                    .replace(/^0+/, '62');
                const resolvedId = await this.client.getNumberId(normalized);
                if (!resolvedId) {
                    this.logger.warn(`Cannot resolve WA ID for number ${normalized}. Skipping send.`);
                    return;
                }
                chat = await this.client.getChatById(resolvedId._serialized);
            }
            await chat.sendStateTyping();
            const baseDelay = Math.min(text.length * 18, 8000);
            const jitter = Math.floor(Math.random() * 3000);
            await this.sleep(baseDelay + jitter, baseDelay + jitter + 1000);
            await chat.clearState();
            await chat.sendMessage(text);
        }
        catch (err) {
            this.logger.error(`Failed to send message to ${to}`, err);
        }
    }

    get clientReady(): boolean {
        return this.isReady;
    }

    getStatus(): WaStatus {
        return this.connectionStatus;
    }

    getQrDataUrl(): string | null {
        return this.latestQrDataUrl;
    }

    async logout(): Promise<void> {
        this.isLoggingOut = true;
        this.isReady = false;
        this.connectionStatus = 'disconnected';
        this.latestQrDataUrl = null;
        const suppressTargetClose = (reason: unknown) => {
            const msg = (reason as any)?.message ?? '';
            const name = (reason as any)?.constructor?.name ?? '';
            if (name === 'TargetCloseError' || msg.includes('Target closed'))
                return;
            this.logger.error('Unexpected unhandled rejection during WA logout', reason);
        };
        process.on('unhandledRejection', suppressTargetClose);
        try {
            await Promise.race([
                this.client.logout().catch(() => { }),
                new Promise<void>(r => setTimeout(r, 4000)),
            ]);
        }
        catch { }
        finally {
            await new Promise(r => setTimeout(r, 500));
            process.removeListener('unhandledRejection', suppressTargetClose);
        }
        try {
            await this.client.destroy();
        }
        catch { }
        const sessionDir = path.join(process.cwd(), '.wwebjs_auth', 'session-rental-bot');
        try {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                this.logger.log(`Deleted WA session folder: ${sessionDir}`);
            }
        }
        catch (err) {
            this.logger.warn(`Could not delete session folder: ${err}`);
        }
        this.isLoggingOut = false;
        setTimeout(() => this.initClient(), 1500);
    }
}
