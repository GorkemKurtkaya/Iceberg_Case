import { IsIn, IsNotEmpty } from 'class-validator';
import { getValidationMessage } from '../../_common/enums/ValidationMessages.enum';
import { DtoPrefix } from '../../_common/enums/ValidationMessages.enum';
import { ValidationType } from '../../_common/enums/ValidationMessages.enum';

export class UpdateStageDto {

  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.STAGE, ValidationType.NOT_EMPTY) })
  @IsIn(['agreement','earnest_money','title_deed','completed'] , { message: getValidationMessage(DtoPrefix.STAGE, ValidationType.INVALID_STAGE_TRANSITION) })
  stage: 'agreement'|'earnest_money'|'title_deed'|'completed';
}
