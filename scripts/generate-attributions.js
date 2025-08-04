#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_LOCK_PATH = path.join(__dirname, '..', 'package-lock.json');
const ATTRIBUTIONS_PATH = path.join(__dirname, '..', 'ATTRIBUTIONS.md');

/**
 * Extract license information from a package
 */
function extractLicenseInfo(packageData) {
  const licenses = new Set();

  if (packageData.license) {
    licenses.add(packageData.license);
  }

  if (packageData.licenses) {
    if (Array.isArray(packageData.licenses)) {
      packageData.licenses.forEach(license => {
        if (typeof license === 'string') {
          licenses.add(license);
        } else if (license.type) {
          licenses.add(license.type);
        }
      });
    }
  }

  return Array.from(licenses);
}

/**
 * Get license text from common license files
 */
function getLicenseText(packagePath) {
  const possibleLicenseFiles = [
    'LICENSE',
    'LICENSE.txt',
    'LICENSE.md',
    'license',
    'license.txt',
    'license.md',
    'LICENCE',
    'LICENCE.txt',
    'LICENCE.md',
    'COPYING',
  ];

  for (const fileName of possibleLicenseFiles) {
    const licensePath = path.join(packagePath, fileName);
    if (fs.existsSync(licensePath)) {
      try {
        return fs.readFileSync(licensePath, 'utf8').trim();
      } catch (error) {
        console.warn(`Could not read license file ${licensePath}:`, error.message);
      }
    }
  }

  return null;
}

/**
 * Get standard license text for common licenses
 */
function getStandardLicenseText(licenseType) {
  const standardLicenses = {
    MIT: `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

    ISC: `ISC License

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,

    'Apache-2.0': `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity. For the purposes of this definition,
"control" means (i) the power, direct or indirect, to cause the
direction or management of such entity, whether by contract or
otherwise, or (ii) ownership of fifty percent (50%) or more of the
outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity
exercising permissions granted by this License.

"Source" shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" shall mean any form resulting from mechanical
transformation or translation of a Source form, including but
not limited to compiled object code, generated documentation,
and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or
Object form, made available under the License, as indicated by a
copyright notice that is included in or attached to the work
(which shall not include communications that are not part of the work).

"Derivative Works" shall mean any work, whether in Source or Object
form, that is based upon (or derived from) the Work and for which the
editorial revisions, annotations, elaborations, or other modifications
represent, as a whole, an original work of authorship. For the purposes
of this License, Derivative Works shall not include works that remain
separable from, or merely link (or bind by name) to the interfaces of,
the Work and derivative works thereof.

"Contribution" shall mean any work of authorship, including
the original version of the Work and any modifications or additions
to that Work or Derivative Works thereof, that is intentionally
submitted to Licensor for inclusion in the Work by the copyright owner
or by an individual or Legal Entity authorized to submit on behalf of
the copyright owner. For the purposes of this definition, "submitted"
means any form of electronic, verbal, or written communication sent
to the Licensor or its representatives, including but not limited to
communication on electronic mailing lists, source code control
systems, and issue tracking systems that are managed by, or on behalf
of, the Licensor for the purpose of discussing and improving the Work,
but excluding communication that is conspicuously marked or otherwise
designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity
on behalf of whom a Contribution has been received by Licensor and
subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
copyright license to use, reproduce, prepare Derivative Works of,
publicly display, publicly perform, sublicense, and distribute the
Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
this License, each Contributor hereby grants to You a perpetual,
worldwide, non-exclusive, no-charge, royalty-free, irrevocable
(except as stated in this section) patent license to make, have made,
use, offer to sell, sell, import, and otherwise transfer the Work,
where such license applies only to those patent claims licensable
by such Contributor that are necessarily infringed by their
Contribution(s) alone or by combination of their Contribution(s)
with the Work to which such Contribution(s) was submitted. If You
institute patent litigation against any entity (including a
cross-claim or counterclaim in a lawsuit) alleging that the Work
or a Contribution incorporated within the Work constitutes direct
or contributory patent infringement, then any patent licenses
granted to You under this License for that Work shall terminate
as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
Work or Derivative Works thereof in any medium, with or without
modifications, and in Source or Object form, provided that You
meet the following conditions:

(a) You must give any other recipients of the Work or
    Derivative Works a copy of this License; and

(b) You must cause any modified files to carry prominent notices
    stating that You changed the files; and

(c) You must retain, in the Source form of any Derivative Works
    that You distribute, all copyright, patent, trademark, and
    attribution notices from the Source form of the Work,
    excluding those notices that do not pertain to any part of
    the Derivative Works; and

(d) If the Work includes a "NOTICE" text file as part of its
    distribution, then any Derivative Works that You distribute must
    include a readable copy of the attribution notices contained
    within such NOTICE file, excluding those notices that do not
    pertain to any part of the Derivative Works, in at least one
    of the following places: within a NOTICE text file distributed
    as part of the Derivative Works; within the Source form or
    documentation, if provided along with the Derivative Works; or,
    within a display generated by the Derivative Works, if and
    wherever such third-party notices normally appear. The contents
    of the NOTICE file are for informational purposes only and
    do not modify the License. You may add Your own attribution
    notices within Derivative Works that You distribute, alongside
    or as an addendum to the NOTICE text from the Work, provided
    that such additional attribution notices cannot be construed
    as modifying the License.

You may add Your own copyright notice and license terms to Your
modifications or derivative works. However, in doing so, You may not
remove or alter any copyright or other attribution notices from the
Work, except as permitted by this section.

5. Submission of Contributions. Unless You explicitly state otherwise,
any Contribution intentionally submitted for inclusion in the Work
by You to the Licensor shall be under the terms and conditions of
this License, without any additional terms or conditions.
Notwithstanding the above, nothing herein shall supersede or modify
the terms of any separate license agreement you may have executed with
Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
names, trademarks, service marks, or product names of the Licensor,
except as required for reasonable and customary use in describing the
origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
agreed to in writing, Licensor provides the Work (and each
Contributor provides its Contributions) on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied, including, without limitation, any warranties or conditions
of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
PARTICULAR PURPOSE. You are solely responsible for determining the
appropriateness of using or redistributing the Work and assume any
risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
whether in tort (including negligence), contract, or otherwise,
unless required by applicable law (such as deliberate and grossly
negligent acts) or agreed to in writing, shall any Contributor be
liable to You for damages, including any direct, indirect, special,
incidental, or consequential damages of any character arising as a
result of this License or out of the use or inability to use the
Work (including but not limited to damages for loss of goodwill,
work stoppage, computer failure or malfunction, or any and all
other commercial damages or losses), even if such Contributor
has been advised of the possibility of such damages.

9. Accepting Warranty or Support. You may choose to offer, and to
charge a fee for, warranty, support, indemnity or other liability
obligations to one or more recipients of Derivative Works. However,
in doing so, You may act only on Your own behalf and on Your
sole responsibility, not on behalf of any other Contributor, and only
if You agree to indemnify, defend, and hold each Contributor harmless
for any liability incurred by, or claims asserted against, such
Contributor by reason of your accepting any such warranty or support.

END OF TERMS AND CONDITIONS`,

    'BSD-2-Clause': `BSD 2-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

    'BSD-3-Clause': `BSD 3-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  };

  return standardLicenses[licenseType] || null;
}

/**
 * Main function to generate attributions
 */
async function generateAttributions() {
  try {
    console.log('Reading package-lock.json...');

    if (!fs.existsSync(PACKAGE_LOCK_PATH)) {
      console.error('package-lock.json not found!');
      process.exit(1);
    }

    const packageLockContent = fs.readFileSync(PACKAGE_LOCK_PATH, 'utf8');
    const packageLock = JSON.parse(packageLockContent);

    const packages = packageLock.packages || {};
    const dependencies = [];

    console.log('Processing dependencies...');

    // Process all packages from package-lock.json
    for (const [packagePath, packageData] of Object.entries(packages)) {
      // Skip the root package and local packages
      if (
        packagePath === '' ||
        packagePath.startsWith('packages/') ||
        packagePath.includes('@aignostics/platform-')
      ) {
        continue;
      }

      const packageName = packagePath.replace(/^node_modules\//, '').split('/node_modules/')[0];

      // Skip duplicates and local packages
      if (
        dependencies.some(dep => dep.name === packageName) ||
        packageName.includes('@aignostics/platform-')
      ) {
        continue;
      }

      const licenses = extractLicenseInfo(packageData);
      const version = packageData.version || 'unknown';

      let licenseText = null;

      // Try to find license text
      if (licenses.length > 0) {
        // First try to get license text from the package directory
        const fullPackagePath = path.join(__dirname, '..', 'node_modules', packageName);
        licenseText = getLicenseText(fullPackagePath);

        // If no license file found, use standard license text
        if (!licenseText && licenses[0]) {
          licenseText = getStandardLicenseText(licenses[0]);
        }
      }

      dependencies.push({
        name: packageName,
        version: version,
        licenses: licenses,
        licenseText: licenseText || 'License text not available',
      });
    }

    // Sort dependencies by name
    dependencies.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Found ${dependencies.length} dependencies`);

    // Generate the attributions file
    console.log('Generating ATTRIBUTIONS.md...');

    let attributionsContent = `# Third-Party Software Attributions

## Thank You

We would like to express our gratitude to the open-source community and the maintainers of the following libraries. Without their contributions, this project would not be possible. Thank you for your dedication to creating and maintaining high-quality, freely available software.

This project depends on the following third-party libraries:

---

`;

    for (const dep of dependencies) {
      attributionsContent += `## ${dep.name}

**Version:** ${dep.version}  
**License:** ${dep.licenses.join(', ') || 'Unknown'}

\`\`\`
${dep.licenseText}
\`\`\`

---

`;
    }

    attributionsContent += `
*This file was automatically generated from package-lock.json*
`;

    fs.writeFileSync(ATTRIBUTIONS_PATH, attributionsContent);
    console.log(`✅ Generated attributions file: ${ATTRIBUTIONS_PATH}`);
    console.log(`📊 Included ${dependencies.length} dependencies`);
  } catch (error) {
    console.error('Error generating attributions:', error);
    process.exit(1);
  }
}

// Run the script
generateAttributions();
