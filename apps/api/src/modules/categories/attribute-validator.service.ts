import { BadRequestException, Injectable } from '@nestjs/common';
import type { CategoryAttributeSchema } from '@turkiye-pazaryeri/types';

@Injectable()
export class AttributeValidatorService {
  validate(
    schema: CategoryAttributeSchema | Record<string, unknown>,
    attributes: Record<string, unknown>,
  ): void {
    const parsed = this.normalizeSchema(schema);
    const errors: string[] = [];

    for (const [key, field] of Object.entries(parsed.fields)) {
      const value = attributes[key];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} zorunludur`);
        continue;
      }

      if (value === undefined || value === null) continue;

      switch (field.type) {
        case 'string':
          if (typeof value !== 'string') errors.push(`${key} metin olmalı`);
          break;
        case 'number':
          if (typeof value !== 'number') errors.push(`${key} sayı olmalı`);
          else {
            if (field.minimum !== undefined && value < field.minimum) {
              errors.push(`${key} en az ${field.minimum} olmalı`);
            }
            if (field.maximum !== undefined && value > field.maximum) {
              errors.push(`${key} en fazla ${field.maximum} olmalı`);
            }
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') errors.push(`${key} boolean olmalı`);
          break;
        case 'enum':
          if (typeof value !== 'string' || !field.options?.includes(value)) {
            errors.push(`${key} geçerli bir seçenek değil`);
          }
          break;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Geçersiz özellikler', errors });
    }
  }

  private normalizeSchema(schema: CategoryAttributeSchema | Record<string, unknown>): CategoryAttributeSchema {
    if ('fields' in schema && typeof schema.fields === 'object') {
      return schema as CategoryAttributeSchema;
    }
    return { fields: schema as CategoryAttributeSchema['fields'] };
  }
}
