import { forwardRef, Module } from '@nestjs/common';
import { ConfigRealmController } from './config-realm.controller';
import { ConfigRealmService } from './config-realm.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ConfigRealmController],
  providers: [ConfigRealmService],
  exports: [ConfigRealmService],
})
export class ConfigRealmModule {}