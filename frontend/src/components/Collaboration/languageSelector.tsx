import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Text from '@mui/material/Typography';
import { Stack } from '@mui/material';
import React from "react";

type LanguageVersions = {
  [key: string]: string;
};

type CodeSnippets = {
  [key: string]: string;
};

interface LanguageSelectorProps {
  language: string;
  onSelect: (language: string) => void;
}

export const LANGUAGE_VERSIONS: LanguageVersions = {
  "C++": "GCC 9.2.0",
  "Java": "OpenJDK 13.0.1",
  "Python 3": "Python 3.8.1",
  "Javascript": "Node.js 12.14.0",
  "C#": "Mono 6.6.0.161",
  "SQL": "SQLite 3.27.2",
};

export const CODE_SNIPPETS: CodeSnippets = {
  "C++": `#include <iostream>\n\nint main() {\n\tstd::cout << "Hello, World!" << std::endl;\n\treturn 0;\n}\n`,
  "Java": `public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  "Python 3": `def greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  "Javascript": `function greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  "C#": 'public class Program\n{\n\tpublic static void Main(string[] args)\n\t{\n\t\tSystem.Console.WriteLine("Hello World");\n\t}\n}',
  "SQL": 'CREATE TABLE helloword (phrase TEXT); \n.tables'
};

const languages: [string, string][] = Object.entries(LANGUAGE_VERSIONS);

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onSelect }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Stack direction="row" spacing={1} alignItems="center">
        <Text color='#fafafa' fontSize="14px">
          Language:
        </Text>
        <Button
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          sx={{
            fontSize: "12px",
            textTransform: "none",
            color: "white",
            backgroundColor: "grey.900",
            '&:hover': {
              backgroundColor: "grey.700",
            },
          }}
        >
          {language}
        </Button>
      </Stack>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {languages.map(([lang, version]) => (
          <MenuItem
            key={lang}
            onClick={() => {
              onSelect(lang);
              handleClose();
            }}
            value={lang}
          >
            {lang}
            &nbsp;
            <Text color="gray" fontSize="12px">
              ({version})
            </Text>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
export default LanguageSelector;
