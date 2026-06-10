import { useAuthStore } from '@/store/auth'
import * as Avatar from '@radix-ui/react-avatar'
import { Message } from '@/types/chat'

export default function UserMessage({ message }: { message: Message }) {
  const { user } = useAuthStore()

  return (
    <div className="flex justify-end mb-6 w-full">
      <div className="flex gap-4 max-w-[85%] sm:max-w-[75%]">
        <div className="bg-gray-100 rounded-2xl p-4 text-gray-900 shadow-sm border border-gray-200">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <Avatar.Root className="h-10 w-10 shrink-0 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold text-white shadow-sm">
          <Avatar.Fallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</Avatar.Fallback>
        </Avatar.Root>
      </div>
    </div>
  )
}
