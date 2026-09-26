const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function setupAllIcons() {
  const iconSrc = path.join(process.cwd(), 'src/assets/images/app_logo_icon_1788286531457.jpg');
  const publicDir = path.join(process.cwd(), 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate Web & Base Icons
  if (fs.existsSync(iconSrc)) {
    await sharp(iconSrc).resize(512, 512).png().toFile(path.join(publicDir, 'icon.png'));
    await sharp(iconSrc).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
    await sharp(iconSrc).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(iconSrc).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
    await sharp(iconSrc).resize(512, 512).png().toFile(path.join(publicDir, 'logo.png'));
  }

  // 2. Generate Real Windows Multi-Resolution .ico
  try {
    const mod = require('png-to-ico');
    const pngToIco = mod.default || mod;
    const basePng = path.join(publicDir, 'icon.png');
    if (fs.existsSync(basePng)) {
      const icoSizes = [16, 24, 32, 48, 64, 128, 256];
      const tmpPngs = [];
      for (const size of icoSizes) {
        const tmpPath = path.join(publicDir, `icon-tmp-${size}.png`);
        await sharp(basePng).resize(size, size).png().toFile(tmpPath);
        tmpPngs.push(tmpPath);
      }
      const icoBuffer = await pngToIco(tmpPngs);
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
      // Clean up tmp files
      tmpPngs.forEach(file => {
        try { fs.unlinkSync(file); } catch (e) {}
      });
      console.log('Valid Windows ICO created successfully at public/favicon.ico');
    }
  } catch (err) {
    console.error('Warning generating Windows ICO:', err.message);
  }

  // 3. Android Mipmaps
  const resDir = path.join(process.cwd(), 'android/app/src/main/res');
  if (fs.existsSync(resDir)) {
    const basePng = path.join(publicDir, 'icon.png');
    const mipmapSizes = [
      { dir: 'mipmap-mdpi', icon: 48, foreground: 108 },
      { dir: 'mipmap-hdpi', icon: 72, foreground: 162 },
      { dir: 'mipmap-xhdpi', icon: 96, foreground: 216 },
      { dir: 'mipmap-xxhdpi', icon: 144, foreground: 324 },
      { dir: 'mipmap-xxxhdpi', icon: 192, foreground: 432 }
    ];

    for (const { dir, icon, foreground } of mipmapSizes) {
      const targetFolder = path.join(resDir, dir);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      await sharp(basePng).resize(icon, icon).png().toFile(path.join(targetFolder, 'ic_launcher.png'));
      await sharp(basePng).resize(icon, icon).png().toFile(path.join(targetFolder, 'ic_launcher_round.png'));
      await sharp(basePng).resize(foreground, foreground).png().toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    }

    const stringsPath = path.join(resDir, 'values/strings.xml');
    if (fs.existsSync(stringsPath)) {
      let content = fs.readFileSync(stringsPath, 'utf8');
      content = content.replace(/<string name="app_name">.*?<\/string>/g, '<string name="app_name">الرقم الأول</string>');
      content = content.replace(/<string name="title_activity_main">.*?<\/string>/g, '<string name="title_activity_main">الرقم الأول</string>');
      fs.writeFileSync(stringsPath, content, 'utf8');
    }

    // Ensure AndroidManifest.xml has all requested permissions
    const manifestPath = path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      let manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const requiredPermissions = [
        '<uses-permission android:name="android.permission.CAMERA" />',
        '<uses-feature android:name="android.hardware.camera" android:required="false" />',
        '<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
        '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
        '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
        '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
        '<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />',
        '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
        '<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />',
        '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
        '<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />',
        '<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />',
        '<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />',
        '<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />',
        '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
        '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />',
        '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
        '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
        '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
        '<uses-permission android:name="android.permission.VIBRATE" />',
        '<uses-permission android:name="android.permission.WAKE_LOCK" />',
        '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
        '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
        '<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />'
      ];

      for (const perm of requiredPermissions) {
        // Extract tag identifier
        const match = perm.match(/name="([^"]+)"/);
        if (match && match[1]) {
          if (!manifestContent.includes(match[1])) {
            manifestContent = manifestContent.replace('<application', `    ${perm}\n    <application`);
          }
        }
      }
      fs.writeFileSync(manifestPath, manifestContent, 'utf8');
      console.log('Android permissions verified and updated in AndroidManifest.xml');
    }
    console.log('Android mipmaps, strings, and manifest updated successfully');
  }
}

setupAllIcons().catch(err => {
  console.error('Error during setup icons:', err);
  process.exit(1);
});
