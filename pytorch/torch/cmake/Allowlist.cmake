if(__caffe2_allowlist_included)
    return()
endif()

set(__caffe2_allowlist_included TRUE)

set(CAFFE2_ALLOWLISTED_FILES)

if(NOT CAFFE2_ALLOWLIST)
    return()
endif()

# primeiro lê o arquivo allowlist e quebra por linhas
file(READ "${CAFFE2_ALLOWLIST}" allowlist_content)

# converte o conteúdo do arquivo em uma lista cmake
string(REGEX REPLACE "\n" ";" allowlist_content ${allowlist_content})

foreach(item ${allowlist_content})
endforeach()

macro(caffe2_do_allowlist output allowlist)
    set(_tmp)
    foreach(item ${${output}})
        list(FIND ${allowlist} ${item} _index)

        if(${_index} GREATER -1)
            set(_tmp ${_tmp} ${item})
        endif()
    endforeach()
    set(${output} ${_tmp})
endmacro()