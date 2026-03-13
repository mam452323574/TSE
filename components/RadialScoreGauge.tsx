import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { SIZES, SPACING, FONT_WEIGHTS, SHADOWS, BORDER_RADIUS } from '@/constants/theme';

interface RadialScoreGaugeProps {
    score: number;
    maxScore?: number;
    label: string;
    color: string;
    size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RadialScoreGauge: React.FC<RadialScoreGaugeProps> = ({
    score,
    maxScore = 100,
    label,
    color,
    size = 160,
}) => {
    const { colors } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(score / maxScore, 1);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, circumference * (1 - percentage)],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
            <Text style={[styles.label, { color: colors.gray }]}>{label}</Text>

            <View style={styles.gaugeContainer}>
                <Svg width={size} height={size} style={styles.svg}>
                    {/* Background circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.lightGray}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress circle */}
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>

                {/* Score text in center */}
                <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreValue, { color }]}>{score}</Text>
                    <Text style={[styles.scoreMax, { color: colors.gray }]}>/{maxScore}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
    },
    label: {
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.medium,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    gaugeContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        transform: [{ rotate: '0deg' }],
    },
    scoreContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'center',
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: FONT_WEIGHTS.bold,
    },
    scoreMax: {
        fontSize: SIZES.lg,
        fontWeight: FONT_WEIGHTS.medium,
        marginTop: 16,
    },
});

export default RadialScoreGauge;
