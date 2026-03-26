import { IsArray, IsUUID, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderEnvironmentsDto {
  @ApiProperty({
    description:
      'All active environment IDs exactly once, in the desired pipeline order (first item = lowest position).',
    type: [String],
    example: ['a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002'],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  environmentIds: string[];
}
