import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigRealmModule } from 'src/configRealm/config-realm.module';

@Module({
  imports: [forwardRef(() => ConfigRealmModule)],
  providers: [AuthService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}