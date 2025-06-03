import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints || {};
        return Object.values(constraints).join(', ');
      });

      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: unknown): metatype is new () => object {
    const types = [String, Boolean, Number, Array, Object] as unknown[];
    return !types.includes(metatype);
  }
}
