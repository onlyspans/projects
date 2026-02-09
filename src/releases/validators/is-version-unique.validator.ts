import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { ReleasesRepository } from '../repositories/releases.repository';

@ValidatorConstraint({ name: 'IsVersionUnique', async: true })
@Injectable()
export class IsVersionUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly releasesRepository: ReleasesRepository) {}

  async validate(version: string, args: ValidationArguments): Promise<boolean> {
    if (!version) {
      return true; // Let other validators handle empty values
    }

    const [projectId, excludeId] = args.constraints;
    if (!projectId) {
      return false;
    }

    return this.releasesRepository.isVersionUnique(projectId, version, excludeId);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Release with version "${args.value}" already exists for this project`;
  }
}

export function IsVersionUnique(projectId: string, excludeId?: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [projectId, excludeId],
      validator: IsVersionUniqueConstraint,
    });
  };
}
