:nnoremap <leader>gw :grep /s <cword> *.js<cr>:copen<cr>
:nnoremap <leader>gr :execute "grep /s ".eval("@0")." *.js"<cr>:copen<cr>

:execute "ProjectRootCD"
let g:ctrlp_root_markers = ['.vimprj']
let g:vimprj_root = getcwd()
echo g:vimprj_root

:nnoremap <leader>pr :execute "cd ".g:vimprj_root<cr>
