import { StyleSheet } from "react-native";

export const colors = {
	background: "#DDF",
	text: "#2B2A2A",
	header: "#5A7ACD",
};

export const globalStyles = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
