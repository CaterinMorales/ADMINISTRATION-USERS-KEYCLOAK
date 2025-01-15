import { IsBoolean, IsNumber } from 'class-validator';

export class UpdateBruteForceSettingsDto {
  @IsBoolean()
  bruteForceProtected: boolean;

  @IsNumber()
  failureFactor: number;

  @IsNumber()
  maxDeltaTimeSeconds: number;

  @IsNumber()
  minimumQuickLoginWaitSeconds: number;

  @IsNumber()
  waitIncrementSeconds: number;

  @IsNumber()
  quickLoginCheckMilliSeconds: number;
}
