from app.schemas import AutocompleteRequest, AutocompleteResponse
import re

class AutocompleteService:
    
    def __init__(self):
        # Common patterns and their completions
        self.python_patterns = {
            # Function definitions
            r'def\s+(\w+)\s*\($': lambda m: f'{m.group(0)}self):',
            r'def\s+(\w+)\s*\(\s*self\s*\)$': lambda m: f'{m.group(0)}:\n        pass',
            r'def\s+__init__\s*\(\s*self$': lambda m: f'{m.group(0)}):',
            
            # Class definitions
            r'class\s+(\w+)$': lambda m: f'{m.group(0)}:',
            r'class\s+(\w+)\s*\($': lambda m: f'{m.group(0)}object):',
            
            # Control structures
            r'if\s+(.+?)\s*:$': lambda m: None,  # Complete
            r'if\s+(\w+)$': lambda m: f'{m.group(0)}:',
            r'elif\s+(\w+)$': lambda m: f'{m.group(0)}:',
            r'else$': lambda m: f'{m.group(0)}:',
            r'for\s+(\w+)\s+in\s+(\w+)$': lambda m: f'{m.group(0)}:',
            r'while\s+(.+)$': lambda m: f'{m.group(0)}:',
            
            # Try-except
            r'try$': lambda m: f'{m.group(0)}:',
            r'except$': lambda m: f'{m.group(0)} Exception as e:',
            r'finally$': lambda m: f'{m.group(0)}:',
            
            # Common imports
            r'from\s+(\w+)\s+import$': lambda m: f'{m.group(0)} ',
            r'import\s+numpy$': lambda m: f'{m.group(0)} as np',
            r'import\s+pandas$': lambda m: f'{m.group(0)} as pd',
            
            # Print/return
            r'print\s*\($': lambda m: f'{m.group(0)})',
            r'return$': lambda m: f'{m.group(0)} ',
        }
        
        self.javascript_patterns = {
            r'function\s+(\w+)\s*\($': lambda m: f'{m.group(0)}) {{',
            r'const\s+(\w+)\s*=$': lambda m: f'{m.group(0)} ',
            r'let\s+(\w+)\s*=$': lambda m: f'{m.group(0)} ',
            r'if\s*\($': lambda m: f'{m.group(0)}) {{',
            r'for\s*\($': lambda m: f'{m.group(0)}let i = 0; i < length; i++) {{',
            r'console\.log\s*\($': lambda m: f'{m.group(0)})',
        }
    
    def get_suggestion(self, request: AutocompleteRequest):
        code = request.code
        cursor_pos = request.cursorPosition
        language = request.language.lower()
        
        # Get text before cursor
        before_cursor = code[:cursor_pos]
        lines = before_cursor.split('\n')
        current_line = lines[-1] if lines else ""
        
        # Get the actual line content (preserve indentation)
        line_stripped = current_line.strip()
        indent = len(current_line) - len(current_line.lstrip())
        
        # Empty line - no suggestion
        if not line_stripped:
            return AutocompleteResponse(suggestion="", confidence=0.0)
        
        # Try pattern matching
        suggestion = self._match_patterns(line_stripped, language)
        
        # If no pattern match, try context-aware suggestions
        if not suggestion:
            suggestion = self._context_aware_suggestion(
                before_cursor, 
                current_line, 
                language,
                lines
            )
        
        # Calculate confidence based on pattern quality
        confidence = 0.9 if suggestion else 0.0
        
        return AutocompleteResponse(
            suggestion=suggestion or "",
            confidence=confidence
        )
    
    def _match_patterns(self, line: str, language: str):
        """Match against predefined patterns"""
        patterns = self.python_patterns if language == "python" else self.javascript_patterns
        
        for pattern, completion_func in patterns.items():
            match = re.search(pattern, line)
            if match:
                result = completion_func(match)
                if result and result != line:
                    # Return only the completion part
                    return result[len(line):]
        
        return ""
    
    def _context_aware_suggestion(self, before_cursor: str, current_line: str, language: str, all_lines: list):
        """Smart context-aware suggestions"""
        line_stripped = current_line.strip()
        
        if language == "python":
            # Function call suggestions
            if line_stripped.endswith('.'):
                # Common methods
                return "append()"
            
            # Assignment suggestions
            if '=' in line_stripped and not line_stripped.endswith('='):
                return None
            
            # String operations
            if line_stripped.startswith('print('):
                if not line_stripped.endswith(')'):
                    return ')'
            
            # Common completions
            if line_stripped == 'def':
                return ' main():'
            elif line_stripped == 'class':
                return ' MyClass:'
            elif line_stripped == 'import':
                return ' sys'
            elif line_stripped == 'from':
                return ' typing import'
            elif line_stripped.startswith('if ') and not line_stripped.endswith(':'):
                return ':'
            elif line_stripped.startswith('for ') and ' in ' in line_stripped and not line_stripped.endswith(':'):
                return ':'
            elif line_stripped.startswith('while ') and not line_stripped.endswith(':'):
                return ':'
            
            # Detect incomplete function
            if line_stripped.startswith('def ') and '(' in line_stripped:
                if line_stripped.count('(') > line_stripped.count(')'):
                    return '):'
                elif not line_stripped.endswith(':'):
                    return ':'
            
            # Loop completions
            if line_stripped.startswith('for '):
                if ' in ' not in line_stripped:
                    return ' in range(10):'
            
            # Try-except block
            if len(all_lines) >= 2:
                prev_line = all_lines[-2].strip() if len(all_lines) > 1 else ""
                if prev_line.startswith('try:'):
                    if line_stripped == '':
                        return 'except Exception as e:'
        
        elif language == "javascript":
            if line_stripped.endswith('.'):
                return 'map()'
            
            if line_stripped == 'function':
                return ' myFunction() {'
            elif line_stripped.startswith('const ') and '=' in line_stripped:
                return None
            elif line_stripped.startswith('if (') and line_stripped.count('(') > line_stripped.count(')'):
                return ') {'
        
        return ""
