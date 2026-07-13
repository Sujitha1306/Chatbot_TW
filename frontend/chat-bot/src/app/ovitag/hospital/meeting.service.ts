import {  IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack, ILocalVideoTrack,} from 'agora-rtc-sdk-ng';
export class MeetingService {
  client: IAgoraRTCClient;
  localVideoTrack: ILocalVideoTrack;
  localAudioTrack: ILocalAudioTrack;
  remoteUsers: IAgoraRTCRemoteUser[] = [];
  remoteUserAudio:boolean;
  remoteUserVideo:boolean;
  private AgoraRTC: any;
  async initClient() {
  if (!this.AgoraRTC) {
    const module = await import('agora-rtc-sdk-ng');
    this.AgoraRTC = module.default;
    this.AgoraRTC.setLogLevel(4); // Disable all logs
    this.client = this.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }    
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        const id = 'user-' + user.uid;
        setTimeout(() => user.videoTrack?.play(id), 100);
        const exists = this.remoteUsers.some(u => u.uid === user.uid);
        if (!exists) {
          this.remoteUsers.push(user);
        }
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

this.client.on('user-unpublished', (user, mediaType) => {
  const targetUser = this.remoteUsers.find(u => u.uid === user.uid);
  if (!targetUser) return;

  if (mediaType === 'video') {
    targetUser.hasVideo = false;
  }

  if (mediaType === 'audio') {
    targetUser.hasAudio = false;
  }
});

    this.client.on('user-left', (user) => {
      this.remoteUsers = this.remoteUsers.filter(u => u.uid !== user.uid);

      const playerContainer = document.getElementById(`user-${user.uid}`);
      if (playerContainer) {
        playerContainer.remove();
      }
    });

  }

  async createLocalTrack() {
    this.localVideoTrack = await this.AgoraRTC.createCameraVideoTrack();
    this.localAudioTrack = await this.AgoraRTC.createMicrophoneAudioTrack();
  }

  toggleAudio(mute: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!mute);
    }
  }

  toggleVideo(mute: boolean) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(!mute);
    }
  }

  async joinChannel(channel, token, uid) {
    const UID = parseInt(uid)
    await this.client.join('5361311c86f7446eb602deb5d142695f', channel, token, UID);
  }

  async publishLocalTrack() {
    console.log('thisssssss mk')
    await this.client.publish([this.localVideoTrack, this.localAudioTrack]);
  }

  // async joinChannelWithName(channelName: string) {
  // const uid = Math.floor(Math.random() * 100000);
  // await this.client.join(
  //   '5361311c86f7446eb602deb5d142695f', 
  //   'akash321',
  //   '007eJxTYFibuSZp46e6h1NCG166TFwnrNa+d/vnd/Y3EpVZk2eG6E1QYDBKNUgzSU1LtExNMTFJtbCwTDEwMjczSLQwsEgzS000mPtTMqMhkJEhMC6ZkZEBAkF8DobE7MTiDGMjQwYGAFBlIXI=', // Token
  //   uid
  // );
  // }

  async leaveChannel() {
    if (this.localVideoTrack) {
      this.localVideoTrack.stop();
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    this.remoteUsers=[]
    this.client.leave()
    this.client.removeAllListeners(); 
  }



}