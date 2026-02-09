import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Semver regex pattern: major.minor.patch[-pre-release][+build]
 * Examples: 1.0.0, 1.0.0-alpha, 1.0.0-alpha.1, 1.0.0+build.1, 1.0.0-alpha+build
 */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

@ValidatorConstraint({ name: 'IsSemver', async: false })
export class IsSemverConstraint implements ValidatorConstraintInterface {
  validate(version: string): boolean {
    if (!version) {
      return false;
    }
    return SEMVER_PATTERN.test(version);
  }

  defaultMessage(): string {
    return 'Version must be in semver format (e.g., 1.0.0, 1.0.0-alpha, 1.0.0+build)';
  }
}

export function IsSemver(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsSemverConstraint,
    });
  };
}
