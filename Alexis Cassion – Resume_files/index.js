import { Constants } from './utils/constants.js';
import { sectionRenderers, sectionPreprocessors } from './resume_sections/resume_sections.js';
import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';

Alpine.data('resumeData', resumeData); // register it globally by name
window.Alpine = Alpine;
Alpine.start();


function resumeData() {
    return {
        allSectionsMetadata: {},
        allSectionsData: {},
        pageLayoutData: {},
        sectionRenderers,
        sectionDiagnostics: null,
        websiteLanguage: null,
        currentFlavor: null,
        loaded: false,
    
        async init() {

            const configBasePath = './config';
            const sectionDataBasePath = './resume_sections';

            const browserLang = navigator.language?.slice(0, 2).toLowerCase();
            const urlParams = new URLSearchParams(window.location.search);
            const langFromUrl = urlParams.get("lang")?.toLowerCase();

            const resolveLanguage = (urlLang, browserLang, supported, fallback) =>
                supported.includes(urlLang) ? urlLang :
                supported.includes(browserLang) ? browserLang :
                fallback;

            this.websiteLanguage = resolveLanguage(langFromUrl, browserLang, Constants.SUPPORTED_WEBSITE_LANGUAGES, Constants.DEFAULT_WEBSITE_LANGUAGE);
            this.currentFlavor = urlParams.get("flavor")?.toLowerCase() || "default";

            if (!Constants.SUPPORTED_WEBSITE_LANGUAGES.includes(browserLang)) {
                console.warn(`Unsupported browser language "${browserLang}". Defaulting.`);
            }
    
            // Load static data
            this.allSectionsMetadata = await (await fetch(`${configBasePath}/resume_sections.json`)).json();
            this.pageLayoutData = await (await fetch(`${configBasePath}/page_layout.json`)).json();

            this.sectionDiagnostics = {
                layout: {
                    removedSections: [],
                    collapsedGroups: []
                  },
                  renderers: {
                    missing: []
                  },
                  loading: {
                    failed: []
                  }
            }

            console.log("pageLayoutData",JSON.stringify(this.pageLayoutData.layout[this.currentFlavor]));
            // Check for missing section renderers
            const enabledResumeSections = this.extractSectionsFromLayout(this.pageLayoutData.layout[this.currentFlavor]);
            console.log("enabledResumeSections",enabledResumeSections);

            const missingRenderers = enabledResumeSections.filter(
                (key) => !sectionRenderers[key]
            );

            if (missingRenderers.length > 0) {
                this.sectionDiagnostics.renderers.missing.push(...missingRenderers);
                console.warn(`⚠️ Missing render functions for section(s): ${missingRenderers.join(', ')}`);
                //alert(`Some sections are missing renderers and will not be displayed:\n${missingRenderers.join(', ')}`);
            }

            const boundRenderers = Object.fromEntries(
                Object.entries(sectionRenderers).map(([key, fn]) => [key, fn.bind(this)])
            );
              
            this.sectionRenderers = boundRenderers;
        
            for (const sectionKey of enabledResumeSections) {
                try {
                    //todo alert missing data
                    const response = await fetch(`${sectionDataBasePath}/${sectionKey}/${sectionKey}.json`);
                    
                    if (response.ok) {
                        const sectionContent = await response.json();
                        this.allSectionsData[sectionKey] = sectionContent;
                        this.preprocessSection(this.allSectionsData[sectionKey]);
                        if (this.currentFlavor != null) {
                            this.filterByFlavor(sectionKey, this.allSectionsData[sectionKey]);
                        }
                        console.log(`"${sectionKey}" loaded and processed`);
                    } else {
                        console.warn(`"${sectionKey}" could not be loaded...`);
                    }
                } catch (err) {
                    console.warn(`"${sectionKey}" could not be loaded:`, err);
                }
            }

            this.mutateLayoutTree(this.pageLayoutData.layout[this.currentFlavor],this.allSectionsData, this.sectionDiagnostics);

            console.log("Diagnostics", JSON.stringify(this.sectionDiagnostics));


            this.renderResumeLayoutTree();
    
            this.loaded = true;
        },

        updateWebsiteLanguage(language) {
            const selectedLanguage = (language != null)
                ? Constants.SUPPORTED_WEBSITE_LANGUAGES.includes(language)? language : Constants.DEFAULT_WEBSITE_LANGUAGE
                : Constants.SUPPORTED_WEBSITE_LANGUAGES[(Constants.SUPPORTED_WEBSITE_LANGUAGES.indexOf(this.websiteLanguage) + 1) % Constants.SUPPORTED_WEBSITE_LANGUAGES.length];
            
            this.websiteLanguage = selectedLanguage;

            this.renderResumeLayoutTree();
        },

        getNextWebsiteLanguage() {
            return Constants.SUPPORTED_WEBSITE_LANGUAGES[(Constants.SUPPORTED_WEBSITE_LANGUAGES.indexOf(this.websiteLanguage) + 1) % Constants.SUPPORTED_WEBSITE_LANGUAGES.length].toUpperCase();
        },

        extractSectionsFromLayout(layoutTree) {
            const flat = [];
          
            function walk(node) {
                if (Array.isArray(node)) {
                    for (const item of node) {
                        walk(item);
                    }
                } else if (typeof node === 'string') {
                    flat.push(node);
                }
            }
          
            walk(layoutTree);
            return flat;
        },
                    

        preprocessSection(sectionKey, sectionData) {
            if (sectionPreprocessors[sectionKey]) {
                sectionPreprocessors[sectionKey](sectionData);
            }
        },

        filterByFlavor(sectionKey) {
            const sectionData = this.allSectionsData[sectionKey];
        
            // Skip if no flavor or data is null/undefined
            if (this.currentFlavor == null || this.currentFlavor == "default" || !sectionData)
                return;
        
            // Only filter arrays (e.g. projects, experience)
            if (Array.isArray(sectionData)) {
                this.allSectionsData[sectionKey] = sectionData.filter(
                    item => Array.isArray(item.flavors) && item.flavors.includes(this.currentFlavor)
                );
            }
        
            // Objects like 'about_me' are left untouched
        },          

        mutateLayoutTree(layoutTree, allSectionsData, diagnostics) {
            function prune(node, parent, index) {
                if (Array.isArray(node)) {
                    // First pass: prune nested elements
                    for (let i = node.length - 1; i >= 0; i--) {
                        prune(node[i], node, i);
                    }
        
                    // Remove empty arrays
                    if (node.length === 0 && parent) {
                        parent.splice(index, 1);
                        return;
                    }
        
                    // Flatten single-item arrays
                    if (node.length === 1 && parent) {
                        diagnostics.layout.collapsedGroups.push([...node]);
                        parent.splice(index, 1, node[0]);
                    }
                } else {
                    const data = allSectionsData[node];
                    const isEmpty = !data || (Array.isArray(data) && data.length === 0);
                    if (isEmpty && parent) {
                        diagnostics.layout.removedSections.push(node);
                        parent.splice(index, 1);
                    }
                }
            }
        
            // Start pruning from the root
            for (let i = layoutTree.length - 1; i >= 0; i--) {
                prune(layoutTree[i], layoutTree, i);
            }
        },

        renderResumeLayoutTree() {
            const resumeRoot = document.getElementById("resume");
            resumeRoot.innerHTML = "";
          
            const buildLayout = (tree, level = 0) => {
                const isRow = level % 2 === 1;
                const container = document.createElement('div');
                container.classList.add('resume-group', isRow ? 'horizontal' : 'vertical');
          
                for (const item of tree) {
                    if (Array.isArray(item)) {
                        container.appendChild(buildLayout(item, level + 1));
                    } else {
                        const renderer = this.sectionRenderers[item];
                        const data = this.allSectionsData[item];
                
                        if (typeof renderer !== 'function' || !data) {
                            console.warn(`Skipping section "${item}": renderer or data missing.`);
                            continue;
                        }
                
                        const wrapper = document.createElement('div');
                        wrapper.classList.add('section-wrapper');
                        wrapper.innerHTML = renderer(item);
                        container.appendChild(wrapper);
                    }
                }
            
                return container;
            }

            resumeRoot.appendChild(buildLayout(this.pageLayoutData.layout[this.currentFlavor]));
        },
    }
}

window.addEventListener('languagechange', () => {
    const newLang = navigator.language.slice(0, 2).toLowerCase();
    document.querySelector('[x-data]').__x.$data.updateLanguage(newLang);
});  

function exportPDF() {
    const element = document.getElementById("resume");
    setTimeout(() => {
        html2pdf().from(element).save("resume.pdf");
    }, 300); // slight delay to let Alpine finish rendering
}