<?php
require_once __DIR__ . '/config.php';
require_method('GET');
json_response(['mode'=>email_auth_enabled()?'email':'pin']);
