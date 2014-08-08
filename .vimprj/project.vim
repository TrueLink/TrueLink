:nnoremap <leader>gw :grep -n -r <cword> *.* --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=vendor --include="*.js"<cr>
:nnoremap <leader>gr :execute "grep -r -n ".eval("@0").' --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=vendor --include="*.js'
:execute "ProjectRootCD"
let g:ctrlp_root_markers = ['.vimprj']
let g:vimprj_root = getcwd()
echo g:vimprj_root

:nnoremap <leader>pr :execute "cd ".g:vimprj_root<cr>
