import sys
import os
import logging
from unittest.mock import patch

# Setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
os.environ["STORAGE_BACKEND"] = "hybrid"
os.environ["MYSQL_DB"] = "trackerwave_chat"

from backend.app.db.conversation_store import _store, Message

def test_redis_write_failure():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    # Ensure store is Hybrid
    logger.info(f"Store type: {type(_store)}")

    user_id = "test_user"
    
    # We will mock the redis client rpush to raise an exception
    with patch.object(_store._redis, 'rpush', side_effect=Exception("Simulated Redis write failure!")) as mock_rpush:
        try:
            logger.info("Attempting to create a conversation and write a message...")
            
            # Create conversation
            conv = _store.create(user_id, "Test Question")
            logger.info(f"Created conversation: {conv.id}")

            # Add a message
            msg = Message(role="user", content="Hello, this should save despite Redis failing.")
            _store.add_message(user_id, conv.id, msg)
            
            logger.info("Message added successfully!")
            
            # Verify the mock was called
            mock_rpush.assert_called()
            logger.info("Redis mock was called and raised an exception successfully.")

            # Now let's read it back from MySQL to ensure it saved properly
            saved_messages = _store.get_messages(user_id, conv.id)
            if len(saved_messages) == 1 and saved_messages[0].content == msg.content:
                logger.info("TEST PASSED: Message was successfully written to MySQL despite Redis failure.")
            else:
                logger.error("TEST FAILED: Message not found or mismatched in MySQL.")

        except Exception as e:
            logger.error(f"TEST FAILED: Exception leaked to the caller! {e}")

if __name__ == "__main__":
    test_redis_write_failure()
