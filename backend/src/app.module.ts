import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './presentation/controllers/app.controller';
import { AppService } from './presentation/controllers/app.service';
import { PrismaModule } from './data/prisma/prisma.module';
import { AuthModule } from './presentation/modules/auth.module';
import { CoursesModule } from './presentation/controllers/courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
