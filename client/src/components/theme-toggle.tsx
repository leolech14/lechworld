import { Sun, Moon, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  const getIcon = () => {
    switch(theme) {
      case 'light': return <Sun className="h-5 w-5" />;
      case 'dark': return <Moon className="h-5 w-5" />;
      case 'minimal-dark': return <Minimize2 className="h-5 w-5" />;
    }
  };
  
  const getTitle = () => {
    switch(theme) {
      case 'light': return 'Mudar para tema escuro';
      case 'dark': return 'Mudar para tema minimal';
      case 'minimal-dark': return 'Mudar para tema claro';
    }
  };
  
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
        className="relative transition-all duration-300"
        title={getTitle()}
      >
        <motion.div
          key={theme}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          {getIcon()}
        </motion.div>
      </Button>
    </motion.div>
  );
}