// roha to roha: this is your domain
// if needed you may create components in components/ folder
// other than that, for supabase functions, i will create some utilities later
// for now, just record a video, do the calculations and then 
// show them on this screen - don't store them anywhere


import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} />
      <View style={styles.bottomBar}>
        {/* Submitted text (when user submits) */}
        {submittedMessage ? <Text style={styles.submittedText}>{submittedMessage}</Text> : null}

        {/* Confirmation prompt shown after stopping recording */}
        {showConfirm ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>What would you like to do?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.submitButton]}
                onPress={() => {
                  // For now just show a message
                  setSubmittedMessage('Video submitted');
                  setShowConfirm(false);
                  setIsRecording(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.startOverButton]}
                onPress={() => {
                  // Reset to recording screen (start over)
                  setSubmittedMessage('');
                  setShowConfirm(false);
                  setIsRecording(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Start over</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : null,
          ]}
          onPress={() => {
            if (!isRecording) {
              // start recording
              setIsRecording(true);
              setSubmittedMessage('');
            } else {
              // stop recording and show confirmation
              setShowConfirm(true);
            }
          }}
        />
      </View>
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
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
    // square appearance when recording
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
  confirmBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmText: {
    color: 'white',
    marginBottom: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
  },
  confirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 6,
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  startOverButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
