#
# Cookbook Name:: unreal-ircd
# Library:: password_helper
#
# Copyright (C) 2014 Fred Hatfull
#
#
#
def is_password?(password_hash)
  # Given a hash of password information, determines whether or not this is
  # password information we can act on.
  password_hash.has_key?("text")
end

def format_password(password_hash)
  pass_type_str = ""
  if password_hash['auth_type'] and not ['', 'plaintext'].include? password_hash['auth_type']
    pass_type_str = " { #{password_hash['auth_type']}; }"
  end

  "\"#{password_hash['text']}\"#{pass_type_str}"
end
