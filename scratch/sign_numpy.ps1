$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=TrainlyDevCert" -CertStoreLocation "Cert:\CurrentUser\My"
Export-Certificate -Cert $cert -FilePath "$PSScriptRoot\trainly_dev.cer" -Force
Import-Certificate -FilePath "$PSScriptRoot\trainly_dev.cer" -CertStoreLocation "Cert:\CurrentUser\Root"
Import-Certificate -FilePath "$PSScriptRoot\trainly_dev.cer" -CertStoreLocation "Cert:\CurrentUser\TrustedPublisher"

$pydFiles = Get-ChildItem "C:\Users\LOQ\AppData\Local\Programs\Python\Python314\Lib\site-packages\numpy" -Recurse -Filter "*.pyd"
foreach ($f in $pydFiles) {
    Set-AuthenticodeSignature -Certificate $cert -FilePath $f.FullName
}
