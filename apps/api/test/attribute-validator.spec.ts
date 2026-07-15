import { BadRequestException } from '@nestjs/common';
import { AttributeValidatorService } from '../src/modules/categories/attribute-validator.service';

describe('AttributeValidatorService', () => {
  const validator = new AttributeValidatorService();

  const schema = {
    fields: {
      year: { type: 'number' as const, required: true, minimum: 1990 },
      brand: { type: 'string' as const, required: true },
      condition: { type: 'enum' as const, options: ['sifir', 'ikinci-el'] },
    },
  };

  it('accepts valid attributes', () => {
    expect(() =>
      validator.validate(schema, { year: 2020, brand: 'BMW', condition: 'ikinci-el' }),
    ).not.toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => validator.validate(schema, { year: 2020 })).toThrow(BadRequestException);
  });

  it('rejects invalid enum value', () => {
    expect(() =>
      validator.validate(schema, { year: 2020, brand: 'BMW', condition: 'hasarli' }),
    ).toThrow(BadRequestException);
  });

  it('rejects out-of-range numbers', () => {
    expect(() =>
      validator.validate(schema, { year: 1800, brand: 'BMW' }),
    ).toThrow(BadRequestException);
  });
});
