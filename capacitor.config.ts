import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'todo.task.app.devebt',
  appName: 'App Task',
  webDir: 'www',
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          "@capacitor-firebase/remote-config": {
            "symlink": true
          }
        }
      }
    }
  }
};

export default config;
