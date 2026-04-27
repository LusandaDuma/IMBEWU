import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, X } from 'lucide-react-native';
import { Modal } from 'react-native';

type NolwaziActionType = 'explain' | 'summarize' | 'translate-zulu' | 'ask-anything';

type NolwaziAction = {
  id: NolwaziActionType;
  label: string;
  prompt: string;
};

export interface NolwaziActionsModalProps {
  visible: boolean;
  contextLabel: string;
  onClose: () => void;
  onSelect: (action: NolwaziAction) => void;
}

export function NolwaziActionsModal({
  visible,
  contextLabel,
  onClose,
  onSelect,
}: NolwaziActionsModalProps) {
  const actions: NolwaziAction[] = [
    {
      id: 'explain',
      label: 'Explain',
      prompt: `Explain ${contextLabel} in simple steps for me.`,
    },
    {
      id: 'summarize',
      label: 'Summarize',
      prompt: `Summarize ${contextLabel} with key takeaways.`,
    },
    {
      id: 'translate-zulu',
      label: 'Translate to Zulu',
      prompt: `Translate ${contextLabel} into isiZulu and give the main points clearly.`,
    },
    {
      id: 'ask-anything',
      label: 'Ask anything',
      prompt: `I have a question about ${contextLabel}:`,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <SafeAreaView edges={['bottom']} className="px-4 pb-3">
          <View className="bg-earth-200 rounded-3xl border border-earth-400/40 px-4 py-4">
            <View className="flex-row items-center mb-2">
              <View className="w-9 h-9 rounded-full items-center justify-center bg-primary-500/12">
                <MessageCircle size={16} color="#16a34a" strokeWidth={1.8} />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-earth-900 text-base font-medium">Nolwazi actions</Text>
                <Text className="text-earth-600 text-xs mt-0.5">Choose how Nolwazi should help.</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full items-center justify-center bg-earth-300"
                accessibilityRole="button"
                accessibilityLabel="Close Nolwazi actions"
              >
                <X size={14} color="#44403c" />
              </TouchableOpacity>
            </View>

            <Text className="text-earth-700 text-xs mb-3">{contextLabel}</Text>

            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => onSelect(action)}
                className="bg-white/70 rounded-2xl px-4 py-3 mb-2 border border-earth-300/60"
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text className="text-earth-900 text-sm font-medium">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
