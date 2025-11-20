import React from "react";
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get('window');

// Detectar tamaño de dispositivo
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isShortDevice = height < 700;

export default function PantallaBienvenida({ navigation }: any) {
	// Estilos dinámicos basados en el tamaño de pantalla
	const dynamicStyles = {
		logoSize: isSmallDevice ? 150 : isMediumDevice ? 180 : 200,
		titleSize: isSmallDevice ? 16 : 18,
		featureSize: isSmallDevice ? 13 : 14,
		buttonPadding: isSmallDevice ? 16 : 20,
		verticalSpacing: isShortDevice ? height * 0.05 : height * 0.1,
		contentPadding: isSmallDevice ? 12 : 14,
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingVertical: dynamicStyles.verticalSpacing }
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Logo */}
				<View style={styles.logoContainer}>
					<Image
						source={require('../../assets/splittyLogo.png')}
						resizeMode="contain"
						style={{
							width: dynamicStyles.logoSize,
							height: dynamicStyles.logoSize,
						}}
					/>
				</View>

				{/* Subtítulo */}
				<View style={styles.subtitleContainer}>
					<Text style={[styles.subtitle, { fontSize: dynamicStyles.titleSize }]}>
						{"Gestiona tus gastos compartidos de forma\nsencilla y transparente"}
					</Text>
				</View>

				{/* Features */}
				<View style={[styles.featuresContainer, { paddingVertical: dynamicStyles.contentPadding * 2 }]}>
					<View style={styles.featureRow}>
						<View style={styles.bullet} />
						<Text style={[styles.featureText, { fontSize: dynamicStyles.featureSize }]}>
							{"Divide gastos automáticamente"}
						</Text>
					</View>
					<View style={styles.featureRow}>
						<View style={styles.bullet} />
						<Text style={[styles.featureText, { fontSize: dynamicStyles.featureSize }]}>
							{"Mantén registro de quién debe qué"}
						</Text>
					</View>
					<View style={styles.featureRow}>
						<View style={styles.bullet} />
						<Text style={[styles.featureText, { fontSize: dynamicStyles.featureSize }]}>
							{"Simplifica los pagos entre amigos"}
						</Text>
					</View>
				</View>

				{/* Botón principal */}
				<TouchableOpacity
					style={[
						styles.startButton,
						{ paddingVertical: dynamicStyles.buttonPadding }
					]}
					onPress={() => navigation.navigate('InicioSesion')}
				>
					<Text style={styles.startButtonText}>{"Comenzar"}</Text>
				</TouchableOpacity>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						{"Gratis para siempre • Sin límites de gastos"}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#E6F4F1',
	},
	scrollView: {
		flex: 1,
		backgroundColor: '#E6F4F1',
	},
	scrollContent: {
		flexGrow: 1,
		marginHorizontal: 14,
		justifyContent: 'center',
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 32,
	},
	subtitleContainer: {
		marginBottom: 32,
	},
	subtitle: {
		color: "#555555",
		textAlign: "center",
		marginHorizontal: 17,
		lineHeight: 24,
	},
	featuresContainer: {
		paddingTop: 24,
		paddingBottom: 40,
		marginBottom: 32,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	bullet: {
		width: 8,
		height: 8,
		backgroundColor: "#033E30",
		borderRadius: 4,
		marginRight: 12,
	},
	featureText: {
		color: "#555555",
		flex: 1,
	},
	startButton: {
		alignItems: "center",
		backgroundColor: "#033E30",
		borderRadius: 12,
		marginBottom: 32,
		shadowColor: "#0000001A",
		shadowOpacity: 0.1,
		shadowOffset: {
			width: 0,
			height: 4
		},
		shadowRadius: 6,
		elevation: 6,
	},
	startButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "bold",
	},
	footer: {
		alignItems: "center",
		paddingTop: 24,
	},
	footerText: {
		color: "#555555",
		fontSize: 12,
	},
});