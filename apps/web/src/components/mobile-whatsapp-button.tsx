import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { WhatsAppShare } from './whatsapp-share';

export function MobileWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="whatsapp-mobile-button md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <WhatsAppShare
          trigger={<div style={{ display: 'none' }} />}
          isMobile={true}
        />
      )}
    </>
  );
}