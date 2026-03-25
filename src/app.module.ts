import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { EnvSchema } from './config/env.schema';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            validate: (config) => EnvSchema.parse(config),
        }),
        WhatsappModule,
        DatabaseModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
