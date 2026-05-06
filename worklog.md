---
Task ID: 2
Agent: Main Agent
Task: Fix - Restore original Aafiatak app and add TTS voice notification system

Work Log:
- Discovered original app code was overwritten by my previous work
- Found original commit hash from GitHub events: e4f1d47775bae77ccce7c31dbd4cddc8c5fcb18f
- Cloned and restored the original Aafiatak application (153 source files)
- Original app had: sound-manager.ts (notification tones), NotificationBell.tsx, full dashboards for all 3 roles
- Original app was MISSING: TTS (Text-to-Speech) voice reading of notifications
- Added voice-manager.ts: Complete TTS engine with Arabic/English, gender selection, volume, rate, quiet hours
- Integrated TTS into NotificationBell v6: auto-reads new notifications aloud after tone plays
- Added "Listen" button per notification to re-read with TTS
- Added TTS toggle and microphone test buttons in bell header
- Exported resumeAudioContext from sound-manager.ts for TTS integration
- TTS plays notification tone first, then reads the text (professional experience)
- Preserved ALL existing app functionality (sound-manager, FCM, Capacitor, polling, dedup)
- Pushed to GitHub and deployed to Vercel

Stage Summary:
- Original app fully restored from GitHub history
- TTS voice notification system added as the only new feature
- App running at: https://my-project-kwvgva7x6-mshay2024m-9265s-projects.vercel.app
- GitHub: https://github.com/ForexYemeni/Aafiatak
