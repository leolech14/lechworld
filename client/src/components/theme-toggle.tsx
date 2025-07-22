import { Bot, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={`relative transition-all duration-300 ${
          theme === 'dark-minimal' 
            ? 'bg-white text-black hover:bg-gray-200' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
        title={theme === 'dark-minimal' ? 'Voltar ao modo normal' : 'Ativar modo Dark Minimal'}
      >
        <motion.div
          initial={false}
          animate={{ 
            rotate: theme === 'dark-minimal' ? 180 : 0,
            scale: theme === 'dark-minimal' ? 0 : 1 
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Bot className="h-5 w-5" />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{ 
            rotate: theme === 'dark-minimal' ? 0 : -180,
            scale: theme === 'dark-minimal' ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="absolute theme-toggle-sun"
        >
          <Sun className="h-5 w-5" />
        </motion.div>
      </Button>
    </motion.div>
  );
}