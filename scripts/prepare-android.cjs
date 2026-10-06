// Reproduce native customizations after `cap add android`; no native secrets in source.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const monogram=require('../assets/monogram.json');
const nativeMark=(size,color)=>`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${size}dp" android:height="${size}dp" android:viewportWidth="108" android:viewportHeight="108">${monogram.paths.map(p=>`<path android:fillColor="@android:color/transparent" android:strokeColor="${color}" android:strokeWidth="${p.width}" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="${p.d}" />`).join('')}</vector>`;
const root=path.resolve(__dirname,'..');process.chdir(root);
if(!fs.existsSync('android/app'))cp.execFileSync(process.execPath,['node_modules/@capacitor/cli/bin/capacitor','add','android'],{stdio:'inherit'});
if(process.env.GOOGLE_SERVICES_JSON)fs.writeFileSync('android/app/google-services.json',process.env.GOOGLE_SERVICES_JSON);
const google=JSON.parse(fs.readFileSync('android/app/google-services.json','utf8'));
if(!google.client.some(c=>c.client_info.android_client_info.package_name==='com.wordconquest.app'))throw Error('Firebase Android package mismatch');
const versionCode=Number(process.env.ANDROID_VERSION_CODE || Math.floor((Date.now()-Date.UTC(2026,0,1))/1000));
if(!Number.isSafeInteger(versionCode)||versionCode<2||versionCode>2100000000)throw Error('Invalid Android version code');
const sha=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'rev-parse','--short','HEAD'],{encoding:'utf8'}).trim();
const versionName=`${require('../package.json').version}-${sha}`;
let gradle=fs.readFileSync('android/app/build.gradle','utf8');
gradle=gradle.replace(/versionCode \d+/,`versionCode ${versionCode}`).replace(/versionName "[^"]+"/,`versionName "${versionName}"`);
if(!gradle.includes('WC_ANDROID_KEYSTORE'))gradle=gradle.replace('    buildTypes {',`    signingConfigs {
        debug {
            storeFile file(System.getenv('WC_ANDROID_KEYSTORE') ?: new File(System.getProperty('user.home'), '.android/debug.keystore').absolutePath)
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {`);
if(!gradle.includes('signingConfig signingConfigs.debug'))gradle=gradle.replace('    buildTypes {',`    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }`);
if(!gradle.includes('WC_ANDROID_KEYSTORE')||!gradle.includes('signingConfig signingConfigs.debug'))throw Error('Android signing configuration was not applied');
fs.writeFileSync('android/app/build.gradle',gradle);
let manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8').replace('android:allowBackup="true"','android:allowBackup="false"');
if(!manifest.includes('ic_stat_word_conquest'))manifest=manifest.replace('<activity',`<meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_word_conquest" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="game_updates" />\n        <activity`);
if(!manifest.includes('firebase_messaging_auto_init_enabled'))manifest=manifest.replace('<activity','<meta-data android:name="firebase_messaging_auto_init_enabled" android:value="false" />\n        <activity');
fs.writeFileSync('android/app/src/main/AndroidManifest.xml',manifest);
fs.mkdirSync('android/app/src/main/res/drawable',{recursive:true});
fs.writeFileSync('android/app/src/main/res/drawable/ic_stat_word_conquest.xml',nativeMark(24,'#FFFFFFFF'));
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/android-build.json',JSON.stringify({versionCode,versionName,commit:sha,builtAt:new Date().toISOString()},null,2));
console.log(`Android ${versionName} (${versionCode}) prepared.`);
// Match the native launcher and launch surface to the in-app wordmark.
const res='android/app/src/main/res';
const foreground=nativeMark(108,'#FFFAF7EC');
fs.writeFileSync(res+'/drawable/wc_launcher_foreground.xml',foreground);
fs.writeFileSync(res+'/values/wc_colors.xml','<resources><color name="wc_forest">#385340</color><color name="wc_ivory">#F6F3EB</color></resources>');
fs.writeFileSync(res+'/drawable/wc_splash.xml','<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/wc_ivory" /><item android:width="96dp" android:height="96dp" android:gravity="center"><shape android:shape="rectangle"><solid android:color="@color/wc_forest"/><corners android:radius="24dp"/></shape></item><item android:width="96dp" android:height="96dp" android:gravity="center" android:drawable="@drawable/wc_launcher_foreground"/></layer-list>');
for(const level of [21,26,33]){const dir=res+'/mipmap-anydpi-v'+level;fs.mkdirSync(dir,{recursive:true});const legacy=foreground.replace('<path ', '<path android:fillColor="#FF385340" android:pathData="M0,0h108v108H0z" /><path ');const adaptive=`<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/wc_forest"/><foreground android:drawable="@drawable/wc_launcher_foreground"/>${level===33?'<monochrome android:drawable="@drawable/wc_launcher_foreground"/>':''}</adaptive-icon>`;for(const name of ['ic_launcher','ic_launcher_round'])fs.writeFileSync(dir+'/'+name+'.xml',level===21?legacy:adaptive);}
fs.writeFileSync(res+'/values/styles.xml',`<resources>
<style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar"><item name="colorPrimary">@color/wc_forest</item><item name="colorPrimaryDark">@color/wc_ivory</item><item name="colorAccent">@color/wc_forest</item></style>
<style name="AppTheme.NoActionBar" parent="AppTheme"><item name="windowActionBar">false</item><item name="windowNoTitle">true</item><item name="android:background">@null</item><item name="android:windowLightStatusBar">true</item><item name="android:statusBarColor">@color/wc_ivory</item><item name="android:navigationBarColor">@color/wc_ivory</item><item name="android:windowLightNavigationBar">true</item></style>
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen"><item name="android:background">@drawable/wc_splash</item><item name="windowSplashScreenBackground">@color/wc_ivory</item><item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item><item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item></style>
</resources>`);

const javaDir='android/app/src/main/java/com/wordconquest/app';
fs.mkdirSync(javaDir,{recursive:true});
for(const name of ['MainActivity.java','NotificationSettingsPlugin.java'])fs.copyFileSync('native/android/'+name,javaDir+'/'+name);
