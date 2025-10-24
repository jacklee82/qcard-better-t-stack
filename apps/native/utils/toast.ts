/**
 * Toast 유틸리티
 * Web의 sonner를 대체하는 Native Toast 시스템
 */

import Toast from 'react-native-toast-message';

export const showToast = {
	success: (message: string) => {
		Toast.show({
			type: 'success',
			text1: message,
			position: 'top',
			visibilityTime: 2000,
			topOffset: 60,
		});
	},
	error: (message: string) => {
		Toast.show({
			type: 'error',
			text1: message,
			position: 'top',
			visibilityTime: 3000,
			topOffset: 60,
		});
	},
	info: (message: string) => {
		Toast.show({
			type: 'info',
			text1: message,
			position: 'top',
			visibilityTime: 2000,
			topOffset: 60,
		});
	},
};

