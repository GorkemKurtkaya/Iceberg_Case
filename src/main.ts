import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './_common/exceptions/http.exception.filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory: (errors) => {
      const findFirstError = (errors: ValidationError[]) => {
        for(const error of errors) {
          if(error.constraints) {
            return error.constraints[Object.keys(error.constraints)[0]];
          }
          if(error.children) {
            return findFirstError(error.children);
          }
        }
        return null;
      }
      const error = findFirstError(errors);
      return new BadRequestException(error);
    }
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
