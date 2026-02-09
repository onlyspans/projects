import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ProjectsRepository } from '../repositories/projects.repository';

@ValidatorConstraint({ name: 'IsSlugUnique', async: true })
@Injectable()
export class IsSlugUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async validate(slug: string, args: ValidationArguments): Promise<boolean> {
    if (!slug) {
      return true; // Let other validators handle empty values
    }

    const [excludeId] = args.constraints;
    return this.projectsRepository.isSlugUnique(slug, excludeId);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Project with slug "${args.value}" already exists`;
  }
}

export function IsSlugUnique(
  excludeId?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [excludeId],
      validator: IsSlugUniqueConstraint,
    });
  };
}
