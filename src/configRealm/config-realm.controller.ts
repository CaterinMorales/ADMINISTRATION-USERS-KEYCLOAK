import { Controller, Put, Body, InternalServerErrorException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigRealmService } from './config-realm.service';
import { UpdateBruteForceSettingsDto } from './dto/UpdateBruteForceSettingsDto';

@Controller('config-realm')
export class ConfigRealmController {
  constructor(private readonly configRealmService: ConfigRealmService) { }

  @Put('brute-force-settings')
  async updateBruteForceSettings(@Body() body: UpdateBruteForceSettingsDto) {
    try {
      const result = await this.configRealmService.updateBruteForceSettings(body);

      return {
        message: 'Brute force settings updated successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          message: 'Realm not found in Keycloak.',
          details: error.message,
          timestamp: new Date().toISOString(),
        });
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          message: 'Invalid token.',
          details: error.message,
          timestamp: new Date().toISOString(),
        });
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException({
          message: 'Invalid brute force settings payload.',
          details: error.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error('Unexpected error:', error);
        throw new InternalServerErrorException({
          message: 'An unexpected error occurred while updating brute force settings.',
          details: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

}