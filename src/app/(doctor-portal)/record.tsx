// roha to roha: this is your domain
// if needed you may create components in components/ folder
// other than that, for supabase functions, i will create some utilities later
// for now, just record a video, do the calculations and then 
// show them on this screen - don't store them anywhere

import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';


export default function App() {
  const [facing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const cameraRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  const MAX_DURATION_SECONDS = 20; 

  // Ask for permissions on mount (camera + mic)
  useEffect(() => {
    if (cameraPermission?.granted === false) requestCameraPermission();
    if (micPermission?.granted === false) requestMicPermission();
  }, [cameraPermission?.granted, micPermission?.granted]);

  // Create a player for preview; keep hook order stable (avoid conditional returns before hooks)
  const player = useVideoPlayer(null);

  useEffect(() => {
    if (!recordedUri) return;
    (async () => {
      try {
        await player.replaceAsync(recordedUri);
        player.loop = true;
        player.play();
      } catch (e) {
        console.warn('Player setup error', e);
      }
    })();
  }, [recordedUri]);

  if (!cameraPermission) {
    return <View />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestCameraPermission} title="grant permission" />
      </View>
    );
  }

  async function startRecording() {
    if (!cameraRef.current) return;
    if (!cameraReady) return; // guard until camera preview is ready
    setSubmittedMessage('');
    setRecordedUri(null);
    setShowPreview(false);
    setIsRecording(true);
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_DURATION_SECONDS) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    try {
      // @ts-ignore - recordAsync is available at runtime
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION_SECONDS });
      if (video?.uri) {
        setRecordedUri(video.uri);
        setShowPreview(true);
      }
    } catch (e) {
      console.warn('Recording error', e);
    } finally {
      setIsRecording(false);
      clearInterval(interval);
    }
  }

  function stopRecording() {
    try {
      // @ts-ignore - stopRecording is available at runtime
      cameraRef.current?.stopRecording?.();
    } catch {}
  }

  // (player hook and setup moved above to keep hook order consistent)


async function submitVideo() {
  if (!recordedUri) return;

  setUploading(true);
  setSubmittedMessage('');

  try {
    // 1. Read the recorded file as base64 (legacy API is supported in SDK 54)
    const base64 = await FileSystem.readAsStringAsync(recordedUri, {
      encoding: 'base64',
    });

    const contentType = 'video/mp4';
    const fileName = `${Date.now()}.mp4`;
    const filePath = `recordings/${fileName}`;

    // 2. Convert base64 to ArrayBuffer (RN-friendly) using a data URL
    const arrayBuffer = await (
      await fetch(`data:${contentType};base64,${base64}`)
    ).arrayBuffer();

    // 3. Upload ArrayBuffer to Supabase Storage (recommended for React Native)
    const { error } = await supabase
      .storage
      .from('reference-videos') // your bucket
      .upload(filePath, arrayBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    setSubmittedMessage('video submitted');
  } catch (err: any) {
    console.log('Upload error', err);
    setSubmittedMessage(`upload failed: ${err?.message ?? 'unknown error'}`);
  } finally {
    setUploading(false);
  }
}
  function startOver() {
    setRecordedUri(null);
    setShowPreview(false);
    setSubmittedMessage('');
  }

  return (
    <View style={styles.container}>
      {/* Camera when not previewing */}
      {!showPreview ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          videoQuality="1080p"
          mute={false}
          onCameraReady={() => setCameraReady(true)}
        />
      ) : null}

      {/* Recording control bar when camera is visible */}
      {!showPreview ? (
        <View style={styles.bottomBar}>
          {submittedMessage ? <Text style={styles.submittedText}>{submittedMessage}</Text> : null}
          {isRecording ? (
            <View style={styles.recordingStatus}>
              <View style={styles.redDot} />
              <Text style={styles.recordingText}>{elapsed}s / {MAX_DURATION_SECONDS}s</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={() => (isRecording ? stopRecording() : startRecording())}
            disabled={micPermission?.granted === false}
          />
          {micPermission?.granted === false ? (
            <View style={styles.permissionHint}>
              <Text style={styles.permissionHintText}>Microphone permission required for video</Text>
              <Button title="Enable mic" onPress={requestMicPermission} />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Full-screen preview like Snapchat */}
      {showPreview && recordedUri ? (
        <View style={styles.previewScreen}>
          <VideoView
            player={player}
            style={styles.previewFullVideo}
            contentFit="cover"
            nativeControls={false}
          />
          {/* Actions overlay */}
          <View style={styles.previewActions}>
            <TouchableOpacity style={[styles.actionButton, styles.startOverButton]} onPress={startOver} disabled={uploading}>
              <Text style={styles.actionButtonText}>Start over</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={submitVideo} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
          {submittedMessage ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{submittedMessage}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
    borderWidth: 4,
    borderColor: "white",
  },
  recordingButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'red',
    borderWidth: 4,
    borderColor: 'white',
  },
  submittedText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionHint: {
    marginTop: 12,
    alignItems: 'center',
  },
  permissionHintText: {
    color: 'white',
    marginBottom: 6,
  },
  // Full-screen preview
  previewScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    justifyContent: 'flex-end',
  },
  previewFullVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  previewActions: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  startOverButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  toast: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toastText: {
    color: 'white',
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
});
