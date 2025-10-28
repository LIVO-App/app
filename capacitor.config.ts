import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.istitutodecarneri.livopath',
  appName: 'LIVOApp',
  webDir: 'dist',
  bundledWebRuntime: false
,
    android: {
       buildOptions: {
          keystorePath: 'c:\Users\simon\Temp\livoapp.jks',
          keystoreAlias: 'livopath',
       }
    }
  };

export default config;
