:nnoremap <leader>gw :grep /s <cword> *.js<cr>:copen<cr>
:nnoremap <leader>gr :execute "grep /s ".eval("@0")." *.js"<cr>:copen<cr>
