import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { EnvSchema } from './config/env.schema';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            validate: (config) => EnvSchema.parse(config),
        }),
        WhatsappModule,
        DatabaseModule,
        AuthModule,
    ],
    controllers: [],
    providers: [
        // Global Pipe — validates all incoming request bodies via Zod schemas
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        // Global Filter — formats all HTTP exceptions consistently
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        // Global Interceptor — wraps all success responses in { success, statusCode, data }
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
    ],
})
export class AppModule { }
