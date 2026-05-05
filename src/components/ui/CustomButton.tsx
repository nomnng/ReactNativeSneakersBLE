import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/styles/global";

const CustomButton = ({ onPress, title, disabled = false }) => {
	return (
		<Pressable 
			onPress={disabled ? null : onPress} 
			style={({ pressed }) => [
				{
					backgroundColor: disabled ? "#AAB" : (pressed ? "#05B" : "#6AF"),
				},
				styles.button
			]}
		>
			<Text style={styles.text}>
				{title}
			</Text>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		paddingVertical: 4,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	text: {
		fontSize: 16,
		fontWeight: 600,
		color: colors.text,
	},
});

export default CustomButton;