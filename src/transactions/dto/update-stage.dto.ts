import { IsIn } from 'class-validator';

export class UpdateStageDto {
  @IsIn(['agreement','earnest_money','title_deed','completed'])
  stage: 'agreement'|'earnest_money'|'title_deed'|'completed';
}
