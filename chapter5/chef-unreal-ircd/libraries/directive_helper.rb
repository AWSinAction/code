#
# Cookbook Name:: unreal-ircd
# Library:: directive_helper
#
# Copyright (C) 2014 Fred Hatfull
#
#
#
def optional_directive(directive_name, attr_base, attribute, quoted=false)
  if attr_base[attribute] and not (attr_base[attribute].instance_of?(String) and attr_base[attribute].empty?)
    sep = ''
    sep = '"' if quoted
    "#{directive_name} #{sep}#{attr_base[attribute]}#{sep};"
  else
    ""
  end
end
