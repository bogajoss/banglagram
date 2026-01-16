-- Add individual indexes for sender and receiver to optimize OR queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- Function to get unique conversations with the latest message and user details
CREATE OR REPLACE FUNCTION public.get_conversations(current_user_id uuid, limit_count int DEFAULT 20, offset_count int DEFAULT 0)
RETURNS TABLE (
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    is_verified boolean,
    last_message text,
    last_message_time timestamp with time zone,
    is_read boolean,
    sender_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (partner_id)
            m.id,
            m.content,
            m.created_at,
            m.is_read,
            m.sender_id,
            CASE 
                WHEN m.sender_id = current_user_id THEN m.receiver_id 
                ELSE m.sender_id 
            END AS partner_id
        FROM messages m
        WHERE m.sender_id = current_user_id OR m.receiver_id = current_user_id
        ORDER BY partner_id, m.created_at DESC
    )
    SELECT 
        p.id AS user_id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_verified,
        lm.content AS last_message,
        lm.created_at AS last_message_time,
        lm.is_read,
        lm.sender_id
    FROM latest_messages lm
    JOIN profiles p ON p.id = lm.partner_id
    ORDER BY lm.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;
