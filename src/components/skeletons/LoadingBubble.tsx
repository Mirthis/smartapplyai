import { UserCircle } from "lucide-react";

import LoadingText from "../utils/LoadingText";

const LoadingBubble = () => {
  return (
    <div className="flex items-end gap-x-2">
      <UserCircle className="h-14 w-14 text-secondary" />
      <div className="chat chat-start">
        <div className="chat-bubble chat-bubble-secondary">
          <LoadingText />
        </div>
      </div>
    </div>
  );
};

export default LoadingBubble;
