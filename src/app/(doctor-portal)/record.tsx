// roha to laiba: this is your domain
// if needed you may create components in components/ folder
// other than that, for supabase functions, i will create some utilities later
// for now, just record a video, do the calculations and then 
// show them on this screen - don't store them anywhere


import { Text, View, StyleSheet} from "react-native";

export default function RecordScreen() {
    return(
        <View style={styles.container}>
            <Text>Recording Screen [Laiba's Domain for now]</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }
})