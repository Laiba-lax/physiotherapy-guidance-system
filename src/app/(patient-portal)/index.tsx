import { Text, View } from "react-native";
import { Link } from "expo-router"
import { StyleSheet } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Patient Dashboard</Text>
      <Link href={"/pose-estimation"} style={styles.button}>
      <Text>Perform Exercise</Text>
      </Link>
    </View>
  );
}


const styles = StyleSheet.create({
button: {
  backgroundColor: 'lime',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 6,
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 3,
  elevation: 4
}
})