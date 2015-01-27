:nnoremap <leader>gw :grep -n -r <cword> *.* --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=vendor --include="*.ts"<cr>
:nnoremap <leader>gr :execute "grep -r -n ".eval("@0").' --exclude-dir=node_modules --exclude-dir=lib --exclude-dir=vendor --include="*.js'
:execute "ProjectRootCD"
let g:ctrlp_root_markers = ['.vimprj']
let g:vimprj_root = getcwd()
echo g:vimprj_root

:nnoremap <leader>pr :execute "cd ".g:vimprj_root<cr>

:augroup javascript
:    autocmd!
:    au BufWritePost *.js :call ValidateJSFile()
:augroup END


function! ValidateJSFile()
    :cclo
    let oldmakeprg = &makeprg
    set makeprg=esvalidate\ %

    exe "setl errorformat=Error:\\ Line\\ %l:\\ %m"
    sil :make 
    let qfl = getqflist()
    if len(qfl) > 0
        let curb = bufnr('%')
        for item in qfl
            let item.bufnr = curb
        endfor
        :call setqflist(qfl)
        :copen
    endif
    let &makeprg = oldmakeprg
endfunction

function! CompileMessanger()
    :cclo
    :silent :make frontend/ts/config.ts frontend/ts/main.ts frontend/ts/converters/all.ts --module amd --outDir lib
    if len(getqflist()) > 0
        :copen
    endif
endfunction
:noremap <F5> :call CompileMessanger()<cr>

function! DeployToNginx() 
python << EOF
import shutil
import os
nginx = "E:\\nginx\\root\\html\\"
projectRoot = "C:\\workspace\\flux-react\\"
IGNORE_PATTERNS =  ('node_modules','ts','jsOLD','.hg')
if os.path.isdir(nginx):
    shutil.rmtree(nginx)
shutil.copytree(projectRoot, nginx, ignore=shutil.ignore_patterns(*IGNORE_PATTERNS))

EOF
endfunction

"====================== ESPRIMA TEST


